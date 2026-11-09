package com.rentacar.rentalsystem.rental;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class NoShowScheduler {

    private static final Logger log = LoggerFactory.getLogger(NoShowScheduler.class);

    private final RentalTransactionService transactionService;

    @Scheduled(fixedDelay = 5, timeUnit = TimeUnit.MINUTES)
    public void cancelNoShows() {
        int cancelled = transactionService.cancelNoShows();
        if (cancelled > 0) {
            log.info("Cancelled {} reservation(s) that were not picked up in time.", cancelled);
        }
    }
}
